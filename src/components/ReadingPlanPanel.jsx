import React, { useState, useEffect } from 'react';
import * as DB from '../services/db';
import readingPlansData from '../data/reading-plans.json';
import './ReadingPlanPanel.css';

const ReadingPlanPanel = ({ isOpen, onClose, onNavigate }) => {
  const [activePlans, setActivePlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadUserPlans();
    }
  }, [isOpen]);

  const loadUserPlans = async () => {
    setLoading(true);
    const plans = await DB.getReadingPlans();
    setActivePlans(plans);
    setLoading(false);
  };

  const handleStartPlan = async (planData) => {
    const newPlan = {
      id: planData.id,
      name: planData.name,
      currentDay: 1,
      completedDays: [],
      startDate: Date.now(),
      totalDays: planData.duration
    };
    await DB.updateReadingPlan(newPlan);
    loadUserPlans();
  };

  const handleCompleteDay = async (planId, day) => {
    const plan = activePlans.find(p => p.id === planId);
    if (!plan) return;

    const completedDays = [...new Set([...plan.completedDays, day])];
    const updatedPlan = {
      ...plan,
      completedDays,
      currentDay: day + 1 > plan.totalDays ? plan.totalDays : day + 1
    };
    await DB.updateReadingPlan(updatedPlan);
    loadUserPlans();
  };

  if (!isOpen) return null;

  return (
    <div className="reading-plans-overlay">
      <div className="reading-plans-container">
        <header className="plans-header">
          <button className="back-nav" onClick={onClose}>← Back</button>
          <h2>Reading Plans</h2>
        </header>

        <div className="plans-content">
          <section className="plans-section">
            <h3>Your Active Plans</h3>
            {loading ? (
              <p className="status-text">Loading plans...</p>
            ) : activePlans.length > 0 ? (
              <div className="active-plans-grid">
                {activePlans.map(plan => {
                  const progress = (plan.completedDays.length / plan.totalDays) * 100;
                  const planMeta = readingPlansData.find(p => p.id === plan.id);
                  const todayTask = planMeta?.tasks.find(t => t.day === plan.currentDay);

                  return (
                    <div key={plan.id} className="active-plan-card">
                      <div className="plan-card-header">
                        <h4>{plan.name}</h4>
                        <span className="progress-percent">{Math.round(progress)}%</span>
                      </div>
                      <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                      </div>
                      <p className="day-info">Day {plan.currentDay} of {plan.totalDays}</p>
                      
                      {todayTask && (
                        <div className="today-task">
                          <h5>Today's Reading:</h5>
                          {todayTask.passages.map((p, i) => (
                            <button 
                              key={i} 
                              className="task-passage-btn"
                              onClick={() => {
                                onNavigate({ book: p.book, chapter: p.chapters[0], verse: null });
                                onClose();
                              }}
                            >
                              {p.book} {p.chapters.join(', ')}
                            </button>
                          ))}
                        </div>
                      )}

                      <button 
                        className="complete-day-btn"
                        onClick={() => handleCompleteDay(plan.id, plan.currentDay)}
                      >
                        Mark Day {plan.currentDay} Complete
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="status-text">You haven't started any plans yet.</p>
            )}
          </section>

          <section className="plans-section">
            <h3>Discover Plans</h3>
            <div className="discover-plans-grid">
              {readingPlansData.filter(p => !activePlans.some(ap => ap.id === p.id)).map(plan => (
                <div key={plan.id} className="discover-card">
                  <h4>{plan.name}</h4>
                  <p>{plan.description}</p>
                  <div className="discover-footer">
                    <span>{plan.duration} Days</span>
                    <button className="start-plan-btn" onClick={() => handleStartPlan(plan)}>Start Plan</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ReadingPlanPanel;
