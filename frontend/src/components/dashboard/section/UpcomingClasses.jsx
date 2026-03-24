export default function UpcomingClasses() {
    const classes = [
      {
        name: "GPAT Crash Course - Session 12",
        time: "Today, 3:00 PM",
        students: 234,
      },
      {
        name: "Pharmacokinetics Deep Dive",
        time: "Tomorrow, 11:00 AM",
        students: 189,
      },
    ];
  
    return (
      <div className="bg-dark-200 rounded-xl p-6 border border-dark-100">
  
        <h2 className="text-lg font-semibold mb-6">
          Upcoming Classes
        </h2>
  
        <div className="space-y-4">
  
          {classes.map((cls, index) => (
            <div
              key={index}
              className="p-4 rounded-lg bg-dark-100"
            >
              <p className="font-medium">{cls.name}</p>
  
              <p className="text-grayCustom-medium text-sm">
                {cls.time}
              </p>
  
            </div>
          ))}
  
        </div>
      </div>
    );
  }