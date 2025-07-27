 "use client";
 const Dashboard = ({ stats, ui }) => {


  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">{ui.Dashboard.title}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats?.map((stat, index) => (
          <div
            key={index}
            className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 border border-gray-300 dark:border-gray-700 shadow transition-all hover:border-red-500"
          >
            <div className="flex flex-col md:flex-row justify-between">
              <p className="text-gray-700 dark:text-gray-300">{stat.label}</p>
              <span
                className={`text-xs w-fit font-medium px-2 py-1 rounded ${
                  stat.percentage.startsWith("+")
                    ? "text-green-500 bg-green-100 dark:bg-green-900/30"
                    : "text-red-500 bg-red-100 dark:bg-red-900/30"
                }`}
              >
                {stat.percentage}
              </span>
            </div>
            <p className="text-2xl font-bold mt-2 text-black dark:text-white">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
