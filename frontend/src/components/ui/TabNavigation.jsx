export default function TabNavigation({ tabs, activeTab, onTabChange }) {
    return (
      <div className="border-b border-dark-100 mb-6">
        <div className="flex space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "text-brand-primary border-b-2 border-brand-primary"
                  : "text-grayCustom-medium hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    );
  }