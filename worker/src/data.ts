import { Hono } from 'hono';

type Bindings = {
    DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings; Variables: { jwtPayload: any } }>();

// Get data for a specific month
app.get('/:monthKey', async (c) => {
    const userId = c.get('jwtPayload').id;
    const monthKey = c.req.param('monthKey');

    const incomeSources = await c.env.DB.prepare(
        'SELECT * FROM income_sources WHERE user_id = ? AND month_key = ?'
    )
        .bind(userId, monthKey)
        .all();

    const savingList = await c.env.DB.prepare(
        'SELECT * FROM savings WHERE user_id = ? AND month_key = ?'
    )
        .bind(userId, monthKey)
        .all();

    const budgetingList = await c.env.DB.prepare(
        'SELECT * FROM budget_items WHERE user_id = ? AND month_key = ?'
    )
        .bind(userId, monthKey)
        .all();

    // Fetch daily expenses (Telegram/Manual)
    const expenses = await c.env.DB.prepare(
        'SELECT * FROM daily_expenses WHERE user_id = ? AND month_key = ? ORDER BY date DESC'
    )
        .bind(userId, monthKey)
        .all();

    return c.json({
        incomeSources: incomeSources.results,
        savingList: savingList.results,
        budgetingList: budgetingList.results,
        expenses: expenses.results || [] // Return expenses to frontend
    });
});

// Save data for a specific month (Full Replace Strategy for simplicity)
app.post('/:monthKey', async (c) => {
    try {
        const userId = c.get('jwtPayload').id;
        const monthKey = c.req.param('monthKey');
        const data = await c.req.json();

        const { incomeSources, savingList, budgetingList, expenses } = data;

        // Transaction to replace data
        const batch = [];

        // 1. Delete existing data for this month
        batch.push(c.env.DB.prepare('DELETE FROM income_sources WHERE user_id = ? AND month_key = ?').bind(userId, monthKey));
        batch.push(c.env.DB.prepare('DELETE FROM savings WHERE user_id = ? AND month_key = ?').bind(userId, monthKey));
        batch.push(c.env.DB.prepare('DELETE FROM budget_items WHERE user_id = ? AND month_key = ?').bind(userId, monthKey));
        
        // Only delete expenses if new expenses are provided in the payload (to preserve existing behavior for other clients)
        if (expenses !== undefined) {
            batch.push(c.env.DB.prepare('DELETE FROM daily_expenses WHERE user_id = ? AND month_key = ?').bind(userId, monthKey));
        }

        // 2. Insert new data
        if (incomeSources && incomeSources.length > 0) {
            const stmt = c.env.DB.prepare(
                'INSERT INTO income_sources (id, user_id, month_key, name, amount) VALUES (?, ?, ?, ?, ?)'
            );
            for (const item of incomeSources) {
                batch.push(stmt.bind(item.id, userId, monthKey, item.name, item.amount));
            }
        }

        if (savingList && savingList.length > 0) {
            const stmt = c.env.DB.prepare(
                'INSERT INTO savings (id, user_id, month_key, name, amount) VALUES (?, ?, ?, ?, ?)'
            );
            for (const item of savingList) {
                batch.push(stmt.bind(item.id, userId, monthKey, item.name, item.amount));
            }
        }

        if (budgetingList && budgetingList.length > 0) {
            const stmt = c.env.DB.prepare(
                'INSERT INTO budget_items (id, user_id, month_key, name, allocation, realization, category) VALUES (?, ?, ?, ?, ?, ?, ?)'
            );
            for (const item of budgetingList) {
                batch.push(stmt.bind(item.id, userId, monthKey, item.name, item.allocation, item.realization, item.category));
            }
        }

        if (expenses && expenses.length > 0) {
            const stmt = c.env.DB.prepare(
                'INSERT INTO daily_expenses (id, user_id, month_key, date, description, amount, category, source, telegram_message_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            for (const item of expenses) {
                batch.push(stmt.bind(
                    item.id, 
                    userId, 
                    monthKey, 
                    item.date, 
                    item.description, 
                    item.amount, 
                    item.category || 'Others',
                    item.source || 'manual',
                    item.telegram_message_id || null
                ));
            }
        }

        await c.env.DB.batch(batch);

        return c.json({ success: true });
    } catch (error: any) {
        console.error('Import Error:', error);
        return c.json({ error: error.message || 'Failed to save data' }, 500);
    }
});

// Get Global Settings
app.get('/settings/global', async (c) => {
    const userId = c.get('jwtPayload').id;
    const result = await c.env.DB.prepare('SELECT settings_json FROM global_settings WHERE user_id = ?').bind(userId).first();

    if (result) {
        return c.json(JSON.parse(result.settings_json as string));
    } else {
        // Return default settings if none exist
        return c.json({
            currentYear: new Date().getFullYear(),
            currentMonth: new Date().toLocaleString('default', { month: 'long' }),
            categories: ["Zakat", "Pajak", "Keluarga", "Rumah", "Lainnya"],
            colors: {
                income: "green-100",
                budgeted_expenses: "orange-100",
                spending: "red-100",
                savings: "blue-100"
            },
            lang: "en"
        });
    }
});

// Save Global Settings
app.post('/settings/global', async (c) => {
    const userId = c.get('jwtPayload').id;
    const settings = await c.req.json();
    const settingsJson = JSON.stringify(settings);

    await c.env.DB.prepare(
        'INSERT INTO global_settings (user_id, settings_json) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET settings_json = ?, updated_at = CURRENT_TIMESTAMP'
    )
        .bind(userId, settingsJson, settingsJson)
        .run();

    return c.json({ success: true });
});

// Update individual budget item
app.patch('/budget-items/:id', async (c) => {
    const userId = c.get('jwtPayload').id;
    const itemId = c.req.param('id');
    const updates = await c.req.json();

    // Build dynamic update query based on provided fields
    const allowedFields = ['name', 'allocation', 'realization', 'category'];
    const updateFields: string[] = [];
    const values: any[] = [];

    for (const field of allowedFields) {
        if (updates[field] !== undefined) {
            updateFields.push(`${field} = ?`);
            values.push(updates[field]);
        }
    }

    if (updateFields.length === 0) {
        return c.json({ error: 'No valid fields to update' }, 400);
    }

    // Add WHERE conditions
    values.push(itemId, userId);

    const query = `UPDATE budget_items SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`;
    
    await c.env.DB.prepare(query).bind(...values).run();

    // Fetch and return updated item
    const updatedItem = await c.env.DB.prepare(
        'SELECT * FROM budget_items WHERE id = ? AND user_id = ?'
    ).bind(itemId, userId).first();

    if (!updatedItem) {
        return c.json({ error: 'Item not found' }, 404);
    }

    return c.json({ success: true, item: updatedItem });
});

// Update individual income source
app.patch('/income-sources/:id', async (c) => {
    const userId = c.get('jwtPayload').id;
    const itemId = c.req.param('id');
    const updates = await c.req.json();

    const allowedFields = ['name', 'amount'];
    const updateFields: string[] = [];
    const values: any[] = [];

    for (const field of allowedFields) {
        if (updates[field] !== undefined) {
            updateFields.push(`${field} = ?`);
            values.push(updates[field]);
        }
    }

    if (updateFields.length === 0) {
        return c.json({ error: 'No valid fields to update' }, 400);
    }

    values.push(itemId, userId);

    const query = `UPDATE income_sources SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`;
    
    await c.env.DB.prepare(query).bind(...values).run();

    const updatedItem = await c.env.DB.prepare(
        'SELECT * FROM income_sources WHERE id = ? AND user_id = ?'
    ).bind(itemId, userId).first();

    if (!updatedItem) {
        return c.json({ error: 'Item not found' }, 404);
    }

    return c.json({ success: true, item: updatedItem });
});

// Update individual saving
app.patch('/savings/:id', async (c) => {
    const userId = c.get('jwtPayload').id;
    const itemId = c.req.param('id');
    const updates = await c.req.json();

    const allowedFields = ['name', 'amount'];
    const updateFields: string[] = [];
    const values: any[] = [];

    for (const field of allowedFields) {
        if (updates[field] !== undefined) {
            updateFields.push(`${field} = ?`);
            values.push(updates[field]);
        }
    }

    if (updateFields.length === 0) {
        return c.json({ error: 'No valid fields to update' }, 400);
    }

    values.push(itemId, userId);

    const query = `UPDATE savings SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`;
    
    await c.env.DB.prepare(query).bind(...values).run();

    const updatedItem = await c.env.DB.prepare(
        'SELECT * FROM savings WHERE id = ? AND user_id = ?'
    ).bind(itemId, userId).first();

    if (!updatedItem) {
        return c.json({ error: 'Item not found' }, 404);
    }

    return c.json({ success: true, item: updatedItem });
});

// Update individual expense
app.patch('/expenses/:id', async (c) => {
    const userId = c.get('jwtPayload').id;
    const expenseId = c.req.param('id');
    const updates = await c.req.json();

    const allowedFields = ['description', 'amount', 'category', 'date'];
    const updateFields: string[] = [];
    const values: any[] = [];

    for (const field of allowedFields) {
        if (updates[field] !== undefined) {
            updateFields.push(`${field} = ?`);
            values.push(updates[field]);
        }
    }

    if (updateFields.length === 0) {
        return c.json({ error: 'No valid fields to update' }, 400);
    }

    values.push(expenseId, userId);

    const query = `UPDATE daily_expenses SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`;

    const result = await c.env.DB.prepare(query).bind(...values).run();

    if (result.meta.changes === 0) {
        return c.json({ error: 'Expense not found or unauthorized' }, 404);
    }

    const updatedExpense = await c.env.DB.prepare(
        'SELECT * FROM daily_expenses WHERE id = ? AND user_id = ?'
    ).bind(expenseId, userId).first();

    return c.json({ success: true, expense: updatedExpense });
});

// Delete individual expense
app.delete('/expenses/:id', async (c) => {
    const userId = c.get('jwtPayload').id;
    const expenseId = c.req.param('id');

    const result = await c.env.DB.prepare(
        'DELETE FROM daily_expenses WHERE id = ? AND user_id = ?'
    )
        .bind(expenseId, userId)
        .run();

    if (result.meta.changes === 0) {
        return c.json({ error: 'Expense not found or unauthorized' }, 404);
    }

    return c.json({ success: true });
});

export const dataRoutes = app;
