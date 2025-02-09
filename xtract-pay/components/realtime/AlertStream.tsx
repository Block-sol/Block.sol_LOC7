import { format } from "date-fns";

interface AlertStreamProps {
    alerts: Array<{
      id: string;
      type: 'warning' | 'error' | 'info';
      message: string;
      timestamp: Date;
    }>;
  }
  
  export const AlertStream: React.FC<AlertStreamProps> = ({ alerts }) => {
    return (
      <div className="space-y-2">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={`p-3 rounded-lg ${
              alert.type === 'error' ? 'bg-red-50 text-red-700' :
              alert.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
              'bg-blue-50 text-blue-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{alert.message}</span>
              <span className="text-sm opacity-75">
                {format(alert.timestamp, 'HH:mm:ss')}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };