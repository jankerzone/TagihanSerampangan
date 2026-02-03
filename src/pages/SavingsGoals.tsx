import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { PlusCircle, Trash2, PiggyBank } from 'lucide-react';
import { showSuccess, showError } from "@/utils/toast";
import { Link, useNavigate } from 'react-router-dom';
import { ThemeToggle } from "@/components/ThemeToggle";

const SavingsGoals = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', target: '', color: 'blue' });

  const { data: goalsData, isLoading } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: async () => {
      const response = await api.savingsGoals.getAll();
      // Fetch running balance for each goal
      const goalsWithBalances = await Promise.all(
        response.goals.map(async (goal: any) => {
          try {
            const detailResponse = await api.savingsGoals.getOne(goal.id);
            return {
              ...goal,
              runningBalance: detailResponse.runningBalance || 0,
              progressPercent: detailResponse.progressPercent || 0
            };
          } catch (error) {
            return {
              ...goal,
              runningBalance: 0,
              progressPercent: 0
            };
          }
        })
      );
      return { goals: goalsWithBalances };
    },
    initialData: { goals: [] }
  });

  const { data: summary } = useQuery({
    queryKey: ['savingsSummary'],
    queryFn: api.savingsGoals.getSummary,
    initialData: { totalTarget: 0, totalSaved: 0, totalGoals: 0, progressPercent: 0 }
  });

  const createGoalMutation = useMutation({
    mutationFn: api.savingsGoals.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
      queryClient.invalidateQueries({ queryKey: ['savingsSummary'] });
      showSuccess('Goal created!');
      setNewGoal({ name: '', target: '', color: 'blue' });
      setIsAddOpen(false);
    },
    onError: () => showError('Failed to create goal')
  });

  const deleteGoalMutation = useMutation({
    mutationFn: api.savingsGoals.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
      queryClient.invalidateQueries({ queryKey: ['savingsSummary'] });
      showSuccess('Goal deleted!');
    }
  });

  const handleCreate = () => {
    if (!newGoal.name || !newGoal.target) {
      showError('Name and target required');
      return;
    }
    createGoalMutation.mutate({
      name: newGoal.name,
      target_amount: parseInt(newGoal.target),
      color: newGoal.color,
      icon: 'piggy-bank'
    });
  };

  const colorClasses: any = {
    blue: 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200',
    green: 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200',
    yellow: 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200',
    red: 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200',
    purple: 'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900 dark:border-purple-700 dark:text-purple-200'
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/')}>← Back</Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Savings Goals</h1>
          </div>
          <ThemeToggle />
        </div>

        {/* Summary Card */}
        <Card className="mb-6 bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-800 dark:to-gray-900">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Goals</div>
                <div className="text-2xl font-bold">{summary.totalGoals}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Target</div>
                <div className="text-2xl font-bold">{formatCurrency(summary.totalTarget)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Saved</div>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalSaved)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Overall Progress</div>
                <div className="text-2xl font-bold">{summary.progressPercent}%</div>
                <Progress value={summary.progressPercent} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Button */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="mb-4" size="lg">
              <PlusCircle className="mr-2 h-5 w-5" /> Add Savings Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Savings Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Goal Name</Label>
                <Input value={newGoal.name} onChange={e => setNewGoal({...newGoal, name: e.target.value})} placeholder="e.g., Emergency Fund" />
              </div>
              <div>
                <Label>Target Amount (Rp)</Label>
                <Input type="number" value={newGoal.target} onChange={e => setNewGoal({...newGoal, target: e.target.value})} placeholder="10000000" />
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2">
                  {['blue', 'green', 'yellow', 'red', 'purple'].map(c => (
                    <button key={c} onClick={() => setNewGoal({...newGoal, color: c})} className={`w-8 h-8 rounded-full ${c === newGoal.color ? 'ring-2 ring-offset-2 ring-black' : ''}`} style={{backgroundColor: c}} />
                  ))}
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full">Create Goal</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goalsData.goals.map((goal: any) => {
            const saved = goal.runningBalance || 0;
            const progress = goal.target_amount > 0 ? Math.round((saved / goal.target_amount) * 100) : 0;
            
            return (
              <Card key={goal.id} className={`border-2 ${colorClasses[goal.color] || colorClasses.blue}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PiggyBank className="h-5 w-5" />
                      {goal.name}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteGoalMutation.mutate(goal.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span className="font-bold">{progress}%</span>
                      </div>
                      <Progress value={Math.min(100, progress)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Target</div>
                        <div className="font-bold">{formatCurrency(goal.target_amount)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Saved</div>
                        <div className="font-bold text-green-600">{formatCurrency(saved)}</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/', { state: { addContribution: goal.id } })}>
                      + Add Contribution
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {goalsData.goals.length === 0 && (
          <div className="text-center py-12">
            <PiggyBank className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Savings Goals Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first savings goal to start tracking your progress!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavingsGoals;
