function FilterBar({ sortBy, onSortChange, status, onStatusChange, search, onSearchChange }) {
  return (
    <div className="filter-bar">
      <div className="filter-dropdowns">
        <select
          className="filter-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="createdAt">Date Created</option>
          <option value="title">Title</option>
          <option value="duration">Duration</option>
        </select>

        <select
          className="filter-select"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="all">Status</option>
          <option value="completed">Completed</option>
          <option value="processing">Processing</option>
        </select>

        <select className="filter-select" disabled>
          <option>Duration</option>
        </select>
      </div>

      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  )
}

export default FilterBar
