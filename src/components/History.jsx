import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import './History.css';

const History = ({ historyLogs }) => {
  const [historyDate, setHistoryDate] = useState('');
  const [callerFilter, setCallerFilter] = useState(''); // Caller filter state

  // Dynamically unique callers ki list nikalna
  const uniqueCallers = useMemo(() => {
    const callers = historyLogs.map(log => log.callerPerson || log.callerName || 'Admin');
    return [...new Set(callers)].sort();
  }, [historyLogs]);

  // Date aur Caller dono ke hisaab se filter lagana
  const filteredHistory = useMemo(() => {
    return historyLogs.filter((log) => {
      const matchDate = historyDate ? log.callDate === historyDate : true;
      const logCaller = log.callerPerson || log.callerName || 'Admin';
      const matchCaller = callerFilter ? logCaller === callerFilter : true;
      
      return matchDate && matchCaller;
    });
  }, [historyLogs, historyDate, callerFilter]);

  const fileDateLabel = historyDate || 'all-dates';

  // Export rows (Isme "[Assigned Task Feedback]" rakha h audit trail k liye Excel me)
  const exportRows = filteredHistory.map((log, index) => ({
    No: index + 1,
    Name: log.name || 'Unknown Student',
    Phone: log.phone || 'No phone',
    Date: log.callDate || 'No date',
    Caller: log.callerPerson || log.callerName || 'Admin', 
    Feedback: log.feedback || 'No feedback recorded',
  }));

  const escapeHtml = (value) => {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  };

  const handleExportExcel = () => {
    if (exportRows.length === 0) {
      alert('Export karne ke liye koi history data nahi hai.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 26 },
      { wch: 16 },
      { wch: 14 },
      { wch: 20 }, 
      { wch: 60 }, 
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Call History');
    XLSX.writeFile(workbook, `call-history-${fileDateLabel}.xlsx`);
  };

  const handleExportPDF = () => {
    if (exportRows.length === 0) {
      alert('Export karne ke liye koi history data nahi hai.');
      return;
    }

    const rowsHtml = exportRows
      .map(
        (row) => `
          <tr>
            <td>${row.No}</td>
            <td>${escapeHtml(row.Name)}</td>
            <td>${escapeHtml(row.Phone)}</td>
            <td>${escapeHtml(row.Date)}</td>
            <td>${escapeHtml(row.Caller)}</td>
            <td>${escapeHtml(row.Feedback)}</td>
          </tr>
        `
      )
      .join('');

    const reportTitle = historyDate
      ? `Call History Report - ${historyDate}`
      : 'Call History Report - All Dates';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup blocked hai. Browser me popup allow karke dobara try karo.');
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${escapeHtml(reportTitle)}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 28px; color: #101828; font-family: Inter, Arial, sans-serif; background: #ffffff; }
            .report-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; padding-bottom: 18px; border-bottom: 2px solid #e8edf5; margin-bottom: 20px; }
            .brand { display: flex; align-items: center; gap: 12px; }
            .brand-mark { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; color: #ffffff; font-weight: 900; background: linear-gradient(135deg, #2563eb, #db2777); }
            h1 { margin: 0; font-size: 22px; line-height: 1.2; }
            .meta { margin-top: 5px; color: #667085; font-size: 12px; font-weight: 600; }
            .summary { text-align: right; color: #344054; font-size: 12px; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; overflow: hidden; border-radius: 14px; border: 1px solid #e8edf5; }
            th { color: #344054; background: #f5f7fb; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; text-align: left; padding: 11px 10px; border-bottom: 1px solid #e8edf5; }
            td { color: #101828; font-size: 11px; font-weight: 600; line-height: 1.45; vertical-align: top; padding: 10px; border-bottom: 1px solid #eef2f7; word-wrap: break-word; }
            tr:nth-child(even) td { background: #fbfcfe; }
            th:nth-child(1), td:nth-child(1) { width: 44px; }
            th:nth-child(2), td:nth-child(2) { width: 22%; }
            th:nth-child(3), td:nth-child(3) { width: 14%; }
            th:nth-child(4), td:nth-child(4) { width: 12%; }
            th:nth-child(5), td:nth-child(5) { width: 14%; }
            th:nth-child(6), td:nth-child(6) { width: auto; }
            .footer { margin-top: 18px; color: #98a2b3; font-size: 11px; font-weight: 600; text-align: center; }
            @media print { body { padding: 18px; } .report-header { break-inside: avoid; } tr { break-inside: avoid; } }
          </style>
        </head>
        <body>
          <div class="report-header">
            <div class="brand">
              <div class="brand-mark">K</div>
              <div>
                <h1>${escapeHtml(reportTitle)}</h1>
                <div class="meta">Krins CRM call feedback export</div>
              </div>
            </div>
            <div class="summary">
              <div>Total Logs: ${exportRows.length}</div>
              <div>Date Filter: ${escapeHtml(historyDate || 'All Dates')} | Caller: ${escapeHtml(callerFilter || 'All')}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Student</th>
                <th>Phone</th>
                <th>Date</th>
                <th>Caller</th>
                <th>Feedback</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <div class="footer">Generated from Krins CRM</div>
          <script> window.onload = function() { window.focus(); window.print(); }; </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <section className="panel history-panel premium-layout">
      {/* Premium topbar with icons inside filters */}
      <div className="history-topbar">
        <div>
          <h3 className="panel-title">Interaction Logs</h3>
          <p className="panel-subtitle">
            Securely track all student follow-ups and feedback reports.
          </p>
        </div>

        <div className="history-actions">
          {/* Caller Dropdown Filter (Premium Styling) */}
          <div className="premium-filter-area">
            <div className="date-filter-wrapper premium-select">
              <div className="input-icon-wrapper">
                <span className="icon">👤</span> 
                <select
                  className="input filter-select"
                  value={callerFilter}
                  onChange={(e) => setCallerFilter(e.target.value)}
                >
                  <option value="">All Callers</option>
                  {uniqueCallers.map((caller) => (
                    <option key={caller} value={caller}>{caller}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Filter (Premium Styling) */}
            <div className="date-filter-wrapper premium-date">
              <div className="input-icon-wrapper">
                <span className="icon">📅</span> 
                <input
                  type="date"
                  className="input date-filter"
                  value={historyDate}
                  onChange={(e) => setHistoryDate(e.target.value)}
                  placeholder="Select Date"
                />
              </div>
            </div>

            {(historyDate || callerFilter) && (
              <button 
                className="clear-filter-btn" 
                onClick={() => {
                  setHistoryDate('');
                  setCallerFilter('');
                }}
              >
                Clear
              </button>
            )}
          </div>

          <button className="export-btn pdf-btn premium-btn-icon" onClick={handleExportPDF}>
            <span className="icon">📄</span> Export PDF
          </button>

          <button className="export-btn excel-btn premium-btn-icon" onClick={handleExportExcel}>
            <span className="icon">📊</span> Export Excel
          </button>
        </div>
      </div>

      {/* Summary Row with Icons */}
      <div className="history-summary-row premium-grid">
        <div className="history-summary-card premium-card elevate">
          <div className="card-icon-wrapper blue">📋</div>
          <div className="card-content-area">
            <span>Total Logs</span>
            <strong>{historyLogs.length}</strong>
          </div>
        </div>
        <div className="history-summary-card premium-card elevate">
          <div className="card-icon-wrapper green">👀</div>
          <div className="card-content-area">
            <span>Showing</span>
            <strong>{filteredHistory.length}</strong>
          </div>
        </div>
        <div className="history-summary-card wide premium-card elevate">
          <div className="card-icon-wrapper orange">🛠️</div>
          <div className="card-content-area">
            <span>Active Filters</span>
            <strong>{(historyDate || 'All dates') + ' | ' + (callerFilter || 'All callers')}</strong>
          </div>
        </div>
      </div>

      <div className="history-table premium-container">
        <div className="history-table-head premium-head">
          <div>Student Name</div>
          <div>Mobile Phone</div>
          <div>Call Date</div>
          <div>Assigned Caller</div>
          <div>Submitted Feedback</div>
        </div>

        <div className="history-list premium-list">
          {filteredHistory.length === 0 ? (
            <div className="empty-state history-empty">
              <div className="empty-icon">📭</div>
              <div className="empty-text">No matching call records found.</div>
            </div>
          ) : (
            filteredHistory.map((log) => {
              // FIX: Displays full cleaned feedback by stripping prefix 
              const rawFeedback = log.feedback || 'No feedback recorded';
              const feedbackDisplay = rawFeedback.replace(/^\[Assigned Task Feedback\]:\s*/, '');

              return (
                <div className="history-row premium-row" key={log.id}>
                  <div className="history-user">
                    <div className="history-avatar premium-avatar">
                      {(log.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="history-user-text">
                      <div className="history-name">{log.name || 'Unknown Student'}</div>
                      <div className="history-sub">Call feedback record</div>
                    </div>
                  </div>

                  <div className="history-phone">{log.phone || 'No phone'}</div>

                  <div className="history-date">
                    <span>{log.callDate || 'No date'}</span>
                  </div>

                  <div className="history-caller">
                    <span className="caller-badge">
                      {log.callerPerson || log.callerName || 'Admin'}
                    </span>
                  </div>

                  <div className="feedback-inline">
                    {feedbackDisplay}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};

export default History;