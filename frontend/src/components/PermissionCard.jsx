import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Switch } from './ui/switch'

export function PermissionCard({
  title = 'PERMISSIONS',
  permissions,
  onPermissionChange,
}) {
  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const category = permission.category || 'General'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(permission)
    return acc
  }, {})

  return (
    <Card className='border-2 border-[#F6B72D] bg-white h-full'>
      <CardHeader className='pb-4'>
        <CardTitle className='text-sm font-semibold text-foreground'>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-6 font-exo max-h-96 overflow-y-auto'>
          {Object.entries(groupedPermissions).map(
            ([category, categoryPermissions]) => (
              <div key={category} className='space-y-3'>
                <h4 className='text-sm font-semibold text-[#F6B72D] border-b border-gray-200 pb-1'>
                  {category}
                </h4>
                <div className='space-y-2'>
                  {categoryPermissions.map((permission) => (
                    <div
                      key={permission.name}
                      className='flex items-center justify-between py-1'
                    >
                      <span className='text-sm text-foreground flex-1 mr-3'>
                        {permission.name}
                      </span>
                      <Switch
                        checked={permission.enabled}
                        onCheckedChange={(checked) =>
                          onPermissionChange?.(permission.name, checked)
                        }
                        size='sm'
                      />
                    </div>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      </CardContent>
    </Card>
  )
}
