export const RealTimeIndicator: React.FC<{ active?: boolean }> = ({ active = true }) => {
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
        }`} />
        <span className="text-sm text-gray-500">
          {active ? 'Real-time updates active' : 'Updates paused'}
        </span>
      </div>
    );
  };