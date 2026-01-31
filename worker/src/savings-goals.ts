import { Hono } from 'hono';

type Bindings = {
    DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings; Variables: { jwtPayload: any } }>();

// ===== SAVINGS GOALS ENDPOINTS =====

// Get all savings goals for user
app.get('/goals', async (c) => {
    const userId = c.get('jwtPayload').id;
    
    const goals = await c.env.DB.prepare(
        'SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(userId).all();

    return c.json({ goals: goals.results });
});

// Get a single savings goal with its balance
app.get('/goals/:id', async (c) => {
    const userId = c.get('jwtPayload').id;
    const goalId = c.req.param('id');
    
    const goal = await c.env.DB.prepare(
        'SELECT * FROM savings_goals WHERE id = ? AND user_id = ?'
    ).bind(goalId, userId).first();

    if (!goal) {
        return c.json({ error: 'Goal not found' }, 404);
    }

    // Calculate running balance from all contributions
    const contributions = await c.env.DB.prepare(
        'SELECT SUM(amount) as total FROM savings_contributions WHERE savings_goal_id = ?'
    ).bind(goalId).first();

    const runningBalance = contributions?.total || 0;

    return c.json({ 
        goal,
        runningBalance,
        progressPercent: goal.target_amount > 0 
            ? Math.round((runningBalance / goal.target_amount) * 100) 
            : 0
    });
});

// Create new savings goal
app.post('/goals', async (c) => {
    const userId = c.get('jwtPayload').id;
    const body = await c.req.json();
    
    const { name, target_amount = 0, color = 'blue', icon = 'piggy-bank' } = body;

    if (!name) {
        return c.json({ error: 'Name is required' }, 400);
    }

    const id = Date.now().toString() + Math.random();
    
    await c.env.DB.prepare(
        `INSERT INTO savings_goals (id, user_id, name, target_amount, color, icon) 
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(id, userId, name, target_amount, color, icon).run();

    const newGoal = await c.env.DB.prepare(
        'SELECT * FROM savings_goals WHERE id = ?'
    ).bind(id).first();

    return c.json({ success: true, goal: newGoal });
});

// Update savings goal
app.patch('/goals/:id', async (c) => {
    const userId = c.get('jwtPayload').id;
    const goalId = c.req.param('id');
    const updates = await c.req.json();

    const allowedFields = ['name', 'target_amount', 'color', 'icon', 'is_active'];
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

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(goalId, userId);

    const query = `UPDATE savings_goals SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`;
    
    await c.env.DB.prepare(query).bind(...values).run();

    const updatedGoal = await c.env.DB.prepare(
        'SELECT * FROM savings_goals WHERE id = ? AND user_id = ?'
    ).bind(goalId, userId).first();

    if (!updatedGoal) {
        return c.json({ error: 'Goal not found' }, 404);
    }

    return c.json({ success: true, goal: updatedGoal });
});

// Delete savings goal
app.delete('/goals/:id', async (c) => {
    const userId = c.get('jwtPayload').id;
    const goalId = c.req.param('id');
    
    // Delete associated contributions first (cascade should handle this, but being explicit)
    await c.env.DB.prepare(
        'DELETE FROM savings_contributions WHERE savings_goal_id = ?'
    ).bind(goalId).run();

    // Delete the goal
    await c.env.DB.prepare(
        'DELETE FROM savings_goals WHERE id = ? AND user_id = ?'
    ).bind(goalId, userId).run();

    return c.json({ success: true });
});

// ===== CONTRIBUTIONS ENDPOINTS =====

// Get contributions for a specific month
app.get('/contributions/:monthKey', async (c) => {
    const userId = c.get('jwtPayload').id;
    const monthKey = c.req.param('monthKey');
    
    const contributions = await c.env.DB.prepare(
        `SELECT c.*, g.name as goal_name, g.color, g.icon 
         FROM savings_contributions c
         LEFT JOIN savings_goals g ON c.savings_goal_id = g.id
         WHERE c.user_id = ? AND c.month_key = ?
         ORDER BY c.created_at DESC`
    ).bind(userId, monthKey).all();

    return c.json({ contributions: contributions.results });
});

// Get all contributions for a specific goal
app.get('/goals/:goalId/contributions', async (c) => {
    const userId = c.get('jwtPayload').id;
    const goalId = c.req.param('goalId');
    
    const contributions = await c.env.DB.prepare(
        `SELECT * FROM savings_contributions 
         WHERE savings_goal_id = ? AND user_id = ?
         ORDER BY month_key DESC`
    ).bind(goalId, userId).all();

    return c.json({ contributions: contributions.results });
});

// Add contribution
app.post('/contributions', async (c) => {
    const userId = c.get('jwtPayload').id;
    const body = await c.req.json();
    
    const { savings_goal_id, month_key, amount, notes = '' } = body;

    if (!savings_goal_id || !month_key || !amount) {
        return c.json({ error: 'Missing required fields' }, 400);
    }

    const id = Date.now().toString() + Math.random();
    
    await c.env.DB.prepare(
        `INSERT INTO savings_contributions (id, user_id, savings_goal_id, month_key, amount, notes) 
         VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(id, userId, savings_goal_id, month_key, amount, notes).run();

    const newContribution = await c.env.DB.prepare(
        'SELECT * FROM savings_contributions WHERE id = ?'
    ).bind(id).first();

    return c.json({ success: true, contribution: newContribution });
});

// Update contribution
app.patch('/contributions/:id', async (c) => {
    const userId = c.get('jwtPayload').id;
    const contributionId = c.req.param('id');
    const updates = await c.req.json();

    const allowedFields = ['amount', 'notes'];
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

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(contributionId, userId);

    const query = `UPDATE savings_contributions SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`;
    
    await c.env.DB.prepare(query).bind(...values).run();

    const updated = await c.env.DB.prepare(
        'SELECT * FROM savings_contributions WHERE id = ? AND user_id = ?'
    ).bind(contributionId, userId).first();

    if (!updated) {
        return c.json({ error: 'Contribution not found' }, 404);
    }

    return c.json({ success: true, contribution: updated });
});

// Delete contribution
app.delete('/contributions/:id', async (c) => {
    const userId = c.get('jwtPayload').id;
    const contributionId = c.req.param('id');
    
    await c.env.DB.prepare(
        'DELETE FROM savings_contributions WHERE id = ? AND user_id = ?'
    ).bind(contributionId, userId).run();

    return c.json({ success: true });
});

// ===== SUMMARY/CALCULATIONS =====

// Get total savings summary across all goals
app.get('/summary', async (c) => {
    const userId = c.get('jwtPayload').id;
    
    const summary = await c.env.DB.prepare(
        `SELECT 
            SUM(g.target_amount) as total_target,
            COUNT(g.id) as total_goals,
            (SELECT SUM(amount) FROM savings_contributions WHERE user_id = ?) as total_saved
         FROM savings_goals g
         WHERE g.user_id = ? AND g.is_active = 1`
    ).bind(userId, userId).first();

    return c.json({
        totalTarget: summary?.total_target || 0,
        totalSaved: summary?.total_saved || 0,
        totalGoals: summary?.total_goals || 0,
        progressPercent: summary?.total_target > 0 
            ? Math.round((summary.total_saved / summary.total_target) * 100) 
            : 0
    });
});

// Get monthly contribution total for a specific month
app.get('/contributions/:monthKey/total', async (c) => {
    const userId = c.get('jwtPayload').id;
    const monthKey = c.req.param('monthKey');
    
    const total = await c.env.DB.prepare(
        'SELECT SUM(amount) as total FROM savings_contributions WHERE user_id = ? AND month_key = ?'
    ).bind(userId, monthKey).first();

    return c.json({ 
        monthKey,
        total: total?.total || 0 
    });
});

export const savingsGoalsRoutes = app;
