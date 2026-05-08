// Sample patient data for the demo. Real EEGBase pulls these from Postgres.
// Kept tiny on purpose — the demo is about the workflow, not a CRM.

export type Client = {
  id: string;
  name: string;
  initials: string;
  protocol: string;
  protocolDescription: string;
  sessionsCompleted: number;
  archetype: string;
  nextAppointment?: string; // "10:30 AM"
  device: string;
};

export const CLIENTS: Client[] = [
  {
    id: "sarah",
    name: "Sarah Mitchell",
    initials: "SM",
    protocol: "Focus training",
    protocolDescription: "Helps with attention. Most people see a difference after 8 sessions.",
    sessionsCompleted: 8,
    archetype: "ADHD adolescent",
    nextAppointment: "10:30 AM",
    device: "Mendi",
  },
  {
    id: "james",
    name: "James Okafor",
    initials: "JO",
    protocol: "Calm-and-process",
    protocolDescription: "Helps the body settle so old memories can be revisited safely.",
    sessionsCompleted: 4,
    archetype: "PTSD veteran",
    nextAppointment: "11:30 AM",
    device: "Muse + Polar",
  },
  {
    id: "priya",
    name: "Priya Sharma",
    initials: "PS",
    protocol: "Recovery training",
    protocolDescription: "Helps overworked nervous systems learn to rest.",
    sessionsCompleted: 12,
    archetype: "Burnout recovery",
    nextAppointment: "1:15 PM",
    device: "Mendi",
  },
  {
    id: "daniel",
    name: "Daniel Cruz",
    initials: "DC",
    protocol: "Sleep training",
    protocolDescription: "Helps the brain wind down at night.",
    sessionsCompleted: 3,
    archetype: "Sleep onset trouble",
    nextAppointment: "2:30 PM",
    device: "Muse",
  },
  {
    id: "emily",
    name: "Emily Tanaka",
    initials: "ET",
    protocol: "Performance training",
    protocolDescription: "Helps athletes stay calm under pressure.",
    sessionsCompleted: 6,
    archetype: "Performance",
    device: "Mendi + Polar",
  },
];
