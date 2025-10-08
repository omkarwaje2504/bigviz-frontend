"use client";

const Dashboard = ({ projectData, members, ui }) => {
  const memberList = Array.isArray(members?.data) ? members.data : [];
  const totalCount = memberList.length;
  const approvedCount = memberList.filter(
    (m) => m.photo_approval_status === 1,
  ).length;
  const disapprovedCount = memberList.filter(
    (m) => m.photo_approval_status === 2,
  ).length;
  const pendingCount = memberList.filter(
    (m) => m.photo_approval_status === 0,
  ).length;

  let stats = [
    { label: "Pending", value: pendingCount, color: "yellow" },
    { label: "Total Doctors", value: totalCount, color: "blue" },
  ];
  if (projectData?.config?.employee?.approval_required) {
    stats.push(
      { label: "Approved", value: approvedCount, color: "green" },
      { label: "Disapproved", value: disapprovedCount, color: "red" },
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">
        {ui?.Dashboard?.title || "Dashboard"}
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-700 shadow transition-all hover:border-${stat.color}-500`}
          >
            <div className="flex justify-between items-center">
              <p className="text-gray-700 dark:text-gray-300">{stat.label}</p>
            </div>
            <p
              className={`text-2xl font-bold mt-2 ${
                stat.color === "green"
                  ? "text-green-500"
                  : stat.color === "red"
                    ? "text-red-500"
                    : stat.color === "yellow"
                      ? "text-yellow-500"
                      : "text-blue-500"
              }`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
