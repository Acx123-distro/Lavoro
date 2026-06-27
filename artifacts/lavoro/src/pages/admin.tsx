import { Layout } from "@/components/layout";
import { useGetAdminStats, useListUsers, useSuspendUser, getListUsersQueryKey, getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      setLocation("/dashboard");
    }
  }, [user, authLoading, setLocation]);

  const { data: stats } = useGetAdminStats({
    query: { enabled: user?.role === 'admin' }
  });

  const { data: usersData } = useListUsers({}, {
    query: { enabled: user?.role === 'admin' }
  });

  const suspendMutation = useSuspendUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "User status updated" });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      }
    }
  });

  const handleToggleSuspend = (id: number, currentlySuspended: boolean) => {
    suspendMutation.mutate({
      id,
      data: { suspended: !currentlySuspended }
    });
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Users</CardTitle>
              </CardHeader>
              <CardContent><div className="text-3xl font-bold">{stats.totalUsers}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Jobs</CardTitle>
              </CardHeader>
              <CardContent><div className="text-3xl font-bold">{stats.totalJobs}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Products</CardTitle>
              </CardHeader>
              <CardContent><div className="text-3xl font-bold">{stats.totalProducts}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Suspended</CardTitle>
              </CardHeader>
              <CardContent><div className="text-3xl font-bold text-destructive">{stats.suspendedUsers || 0}</div></CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData?.users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{u.role}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={u.status === 'active' ? 'secondary' : 'destructive'}>
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant={u.status === 'active' ? "destructive" : "outline"} 
                          size="sm"
                          onClick={() => handleToggleSuspend(u.id, u.status === 'suspended')}
                          disabled={u.id === user.id}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Unsuspend'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
