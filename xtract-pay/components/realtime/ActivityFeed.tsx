import { format } from "date-fns";

interface ActivityFeedProps {
    activities: Array<{
      id: string;
      type: string;
      details: any;
      timestamp: Date;
    }>;
  }
  
  export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
    return (
      <div className="space-y-4">
        {activities.map(activity => (
          <div key={activity.id} className="flex gap-4 items-start">
            <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
            <div>
              <p className="font-medium">{activity.type}</p>
              <p className="text-sm text-gray-500">
                {format(activity.timestamp, 'MMM dd, yyyy HH:mm:ss')}
              </p>
              {activity.details && (
                <pre className="mt-2 text-sm bg-gray-50 p-2 rounded">
                  {JSON.stringify(activity.details, null, 2)}
                </pre>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };