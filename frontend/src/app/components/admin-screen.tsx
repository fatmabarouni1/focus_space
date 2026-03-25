import { Card } from '@/app/components/ui/card';

export function AdminScreen() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Admin</h2>
        <p className="text-sm text-muted-foreground">
          Manage users and permissions.
        </p>
      </div>
      <Card className="p-6">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">User Management</h3>
          <p className="text-sm text-muted-foreground">
            Use the admin API to list users and update roles.
          </p>
        </div>
      </Card>
    </div>
  );
}
