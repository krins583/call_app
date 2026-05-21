import React, { useState } from 'react';
import './History.css';

const History = ({ historyLogs }) => {
  // Date filter ka state ab yahi par manage hoga
  const [historyDate, setHistoryDate] = useState('');

  const filteredHistory = historyDate
    ? historyLogs.filter((log) => log.callDate === historyDate)
    : historyLogs;

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h3 className="panel-title">Interaction Logs</h3>
          <p className="panel-subtitle">
            Date wise call feedback aur saved history dekhein.
          </p>
        </div>

        <input
          type="date"
          className="input date-filter"
          value={historyDate}
          onChange={(e) => setHistoryDate(e.target.value)}
        />
      </div>

      <div className="history-list">
        {filteredHistory.length === 0 ? (
          <div className="empty-state">No call history found.</div>
        ) : (
          filteredHistory.map((log) => (
            <div className="history-row" key={log.id}>
              <div>
                <div className="student-name">{log.name || 'Unknown Student'}</div>
                <div className="student-dob">{log.phone || 'No phone'}</div>
              </div>

              <div className="muted">{log.callDate || 'No date'}</div>

              <div className="feedback-box">
                {log.feedback || 'No feedback recorded'}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default History;