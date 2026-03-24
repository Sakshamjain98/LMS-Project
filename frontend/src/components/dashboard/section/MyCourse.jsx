export default function MyCourses() {
    const courses = [
      { name: "Pharmacology - Unit 3", students: 892 },
      { name: "GPAT Mock Test Series", students: 1204 },
      { name: "Pharmaceutical Chemistry", students: 567 },
      { name: "Clinical Pharmacy Basics", students: 438 },
    ];
  
    return (
      <div className="bg-dark-200 rounded-xl p-6 border border-dark-100">
  
        <h2 className="text-lg font-semibold mb-6">
          My Courses
        </h2>
  
        <div className="space-y-4">
          {courses.map((course, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-3 rounded-lg hover:bg-dark-100 transition"
            >
              <div>
                <p className="font-medium">{course.name}</p>
                <p className="text-grayCustom-medium text-sm">
                  {course.students} students
                </p>
              </div>
  
              <span className="text-brand-primary text-sm">
                live
              </span>
  
            </div>
          ))}
        </div>
  
      </div>
    );
  }