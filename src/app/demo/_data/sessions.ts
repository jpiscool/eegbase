// 20-session learning curve for Sarah Mitchell. Drives the Patients drill-in
// and the post-session report. Numbers are illustrative but realistic.

export type Session = {
  id: number;
  date: string;
  durationMin: number;
  // Plain-English summary metrics
  focusScore: number;     // 0-100
  moodScore: number;      // PHQ-9, lower is better (0-27)
  anxietyScore: number;   // GAD-7, lower is better (0-21)
  noteSummary: string;    // one-line AI summary
};

export const SARAH_SESSIONS: Session[] = [
  { id: 20, date: "May 19", durationMin: 46, focusScore: 88, moodScore: 5,  anxietyScore: 4,  noteSummary: "Strongest session yet. Sustained focus most of the protocol." },
  { id: 19, date: "May 12", durationMin: 48, focusScore: 85, moodScore: 5,  anxietyScore: 4,  noteSummary: "Above target. Mood and anxiety scores at lowest point so far." },
  { id: 18, date: "May 5",  durationMin: 43, focusScore: 83, moodScore: 6,  anxietyScore: 4,  noteSummary: "Steady. Client reports better sleep this week." },
  { id: 17, date: "Apr 28", durationMin: 45, focusScore: 80, moodScore: 6,  anxietyScore: 4,  noteSummary: "First session in the high-80s range. Big jump in attention." },
  { id: 16, date: "Apr 21", durationMin: 47, focusScore: 77, moodScore: 7,  anxietyScore: 5,  noteSummary: "On target throughout. Notes from school confirm progress." },
  { id: 15, date: "Apr 14", durationMin: 44, focusScore: 75, moodScore: 7,  anxietyScore: 5,  noteSummary: "Crossed the 75 threshold. Plan: continue current protocol." },
  { id: 14, date: "Apr 7",  durationMin: 46, focusScore: 73, moodScore: 8,  anxietyScore: 6,  noteSummary: "Good rhythm. Session length back to 45+ minutes." },
  { id: 13, date: "Mar 31", durationMin: 43, focusScore: 70, moodScore: 8,  anxietyScore: 6,  noteSummary: "First above-baseline session after the protocol switch." },
  { id: 12, date: "Mar 24", durationMin: 45, focusScore: 68, moodScore: 9,  anxietyScore: 7,  noteSummary: "Client noticed improvement first — confirmed by data." },
  { id: 11, date: "Mar 17", durationMin: 48, focusScore: 65, moodScore: 9,  anxietyScore: 7,  noteSummary: "Steady rise. New protocol working." },
  { id: 10, date: "Mar 10", durationMin: 42, focusScore: 63, moodScore: 10, anxietyScore: 8,  noteSummary: "First session on the new plan." },
  { id: 9,  date: "Mar 3",  durationMin: 45, focusScore: 61, moodScore: 11, anxietyScore: 9,  noteSummary: "Plateau confirmed — switching protocol." },
  { id: 8,  date: "Feb 24", durationMin: 44, focusScore: 58, moodScore: 12, anxietyScore: 9,  noteSummary: "Stuck in the 50s. Time to try something different." },
  { id: 7,  date: "Feb 17", durationMin: 46, focusScore: 54, moodScore: 13, anxietyScore: 10, noteSummary: "Modest gains. Watching for plateau." },
  { id: 6,  date: "Feb 10", durationMin: 42, focusScore: 52, moodScore: 14, anxietyScore: 11, noteSummary: "Progress continues. Sleep also improving per home log." },
  { id: 5,  date: "Feb 3",  durationMin: 43, focusScore: 49, moodScore: 15, anxietyScore: 12, noteSummary: "Crossed 45. Client reports easier mornings." },
  { id: 4,  date: "Jan 27", durationMin: 45, focusScore: 46, moodScore: 16, anxietyScore: 12, noteSummary: "Building. Engagement up vs. early sessions." },
  { id: 3,  date: "Jan 20", durationMin: 40, focusScore: 44, moodScore: 16, anxietyScore: 13, noteSummary: "Steady ramp. No setbacks." },
  { id: 2,  date: "Jan 13", durationMin: 44, focusScore: 42, moodScore: 17, anxietyScore: 13, noteSummary: "Second baseline. Numbers consistent." },
  { id: 1,  date: "Jan 6",  durationMin: 42, focusScore: 38, moodScore: 18, anxietyScore: 14, noteSummary: "Baseline session. Client engaged." },
];

// Today's schedule for the demo clinician.
export type Appointment = {
  time: string;
  clientId: string;
  clientName: string;
  status: "Done" | "Now" | "Upcoming";
};

export const TODAY_SCHEDULE: Appointment[] = [
  { time: "9:00 AM",  clientId: "priya",  clientName: "Priya Sharma",  status: "Done" },
  { time: "10:30 AM", clientId: "sarah",  clientName: "Sarah Mitchell", status: "Now" },
  { time: "11:30 AM", clientId: "james",  clientName: "James Okafor",   status: "Upcoming" },
  { time: "1:15 PM",  clientId: "daniel", clientName: "Daniel Cruz",    status: "Upcoming" },
  { time: "2:30 PM",  clientId: "emily",  clientName: "Emily Tanaka",   status: "Upcoming" },
];

// Sparkline series for Today stats — last 7 days (Sun..Sat).
export const SPARKLINES = {
  sessionsThisWeek: [7, 9, 8, 10, 11, 9, 12],   // headline = 12 today
  avgSessionMin:    [26, 28, 27, 28, 29, 28, 28], // headline = 28
  reportsPending:   [3, 2, 2, 1, 1, 1, 1],       // headline = 1
};
