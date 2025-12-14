import { X, Plus } from 'lucide-react'
import './TabBar.css'

export interface Tab {
  id: string
  name: string
  requestId: string
}

interface TabBarProps {
  tabs: Tab[]
  activeTabId: string | null
  onTabClick: (tabId: string) => void
  onTabClose: (tabId: string, e: React.MouseEvent) => void
  onNewTab: () => void
}

export default function TabBar({ tabs, activeTabId, onTabClick, onTabClose, onNewTab }: TabBarProps) {
  return (
    <div className="tab-bar">
      <div className="tabs-container">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab-item ${activeTabId === tab.id ? 'active' : ''}`}
            onClick={() => onTabClick(tab.id)}
          >
            <span className="tab-name">{tab.name}</span>
            <button
              className="tab-close-button"
              onClick={(e) => onTabClose(tab.id, e)}
              title="Close tab"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <button className="new-tab-button" onClick={onNewTab} title="New tab">
        <Plus size={16} />
      </button>
    </div>
  )
}

