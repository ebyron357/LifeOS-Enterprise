"use client";

import styles from "./CommandMap.module.css";

type CommandMapToolbarProps = {
  query: string;
  entityType: string;
  status: string;
  projectFilter: string;
  focusMode: boolean;
  projectOptions: string[];
  onQueryChange: (value: string) => void;
  onEntityTypeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onProjectFilterChange: (value: string) => void;
  onFocusModeChange: (value: boolean) => void;
  onFitView: () => void;
  onResetView: () => void;
};

export function CommandMapToolbar({
  query,
  entityType,
  status,
  projectFilter,
  focusMode,
  projectOptions,
  onQueryChange,
  onEntityTypeChange,
  onStatusChange,
  onProjectFilterChange,
  onFocusModeChange,
  onFitView,
  onResetView,
}: CommandMapToolbarProps) {
  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Command map controls">
      <label>
        <span>Search</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Find projects, agents, blockers…"
        />
      </label>
      <label>
        <span>Entity</span>
        <select value={entityType} onChange={(event) => onEntityTypeChange(event.target.value)}>
          <option value="">All entities</option>
          <option value="project">Projects</option>
          <option value="business">Businesses</option>
          <option value="agent">Agents</option>
          <option value="blocker">Blockers</option>
          <option value="person">People</option>
          <option value="next-action">Next actions</option>
          <option value="system">Systems</option>
        </select>
      </label>
      <label>
        <span>Status</span>
        <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="waiting">Waiting</option>
          <option value="blocked">Blocked</option>
          <option value="complete">Complete</option>
        </select>
      </label>
      <label>
        <span>Project</span>
        <select value={projectFilter} onChange={(event) => onProjectFilterChange(event.target.value)}>
          <option value="">All projects</option>
          {projectOptions.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </label>
      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={focusMode}
          onChange={(event) => onFocusModeChange(event.target.checked)}
        />
        <span>Focus mode</span>
      </label>
      <div className={styles.toolbarActions}>
        <button type="button" onClick={onFitView}>Fit view</button>
        <button type="button" onClick={onResetView}>Reset view</button>
      </div>
    </div>
  );
}
