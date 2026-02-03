import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, Trash2, PiggyBank } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { showSuccess } from '@/utils/toast';
import { api } from '@/lib/api';

interface SavingsContributionsSectionProps {
  currentKey: string;
}

export const SavingsContributionsSection = ({ currentKey }: SavingsContributionsSectionProps) => {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newContrib, setNewContrib] = useState({ goalId: '', amount: '' });

  const { data: goals } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: api.savingsGoals.getAll,
    initialData: { goals: [] }
  });

  const { data: contributions } = useQuery({
    queryKey: ['savingsContributions', currentKey],
    queryFn: () => api.savingsContributions.getByMonth(currentKey),
    initialData: { contributions: [] }
  });

  const addContribMutation = useMutation({
    mutationFn: api.savingsContributions.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsContributions', currentKey] });
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
      showSuccess('Contribution added!');
      setNewContrib({ goalId: '', amount: '' });
      setIsAddOpen(false);
    }
  });

  const deleteContribMutation = useMutation({
    mutationFn: api.savingsContributions.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsContributions', currentKey] });
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
      showSuccess('Deleted!');
    }
  });

  if (!goals || !goals.goals || goals.goals.length === 0) {
    return (
      <div className="text-center py-8">
        <PiggyBank className="h-12 w-12 mx-auto text-gray-400 mb-2" />
        <p className="text-gray-600 dark:text-gray-400 mb-4">No savings goals yet!</p>
        <Link to="/savings-goals">
          <Button>Create Your First Goal</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="mb-4">
            <PlusCircle className="h-4 w-4 mr-1" /> Add Contribution
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Monthly Contribution</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Goal</Label>
              <Select value={newContrib.goalId} onValueChange={v => setNewContrib({...newContrib, goalId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a goal..." />
                </SelectTrigger>
                <SelectContent>
                  {(goals?.goals || []).map((g: any) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount (Rp)</Label>
              <Input 
                type="number" 
                value={newContrib.amount} 
                onChange={e => setNewContrib({...newContrib, amount: e.target.value})} 
                placeholder="1000000" 
              />
            </div>
            <Button onClick={() => {
              if (!newContrib.goalId || !newContrib.amount) return;
              addContribMutation.mutate({
                savings_goal_id: newContrib.goalId,
                month_key: currentKey,
                amount: parseInt(newContrib.amount)
              });
            }} className="w-full">Add</Button>
          </div>
        </DialogContent>
      </Dialog>

      {(!contributions || !contributions.contributions || contributions.contributions.length === 0) ? (
        <p className="text-gray-500 text-center py-4">No contributions this month</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Goal</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(contributions?.contributions || []).map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.goal_name}</TableCell>
                <TableCell className="text-right">{formatCurrency(c.amount)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => deleteContribMutation.mutate(c.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
};
