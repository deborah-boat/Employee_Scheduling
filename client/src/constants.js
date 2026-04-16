import womanwaiter1 from "./assets/womanwaiter1.png";
import womanwaiter2 from "./assets/womanwaiter2.png";
import womanwaiter3 from "./assets/womanwaiter3.png";
import menwaiter from "./assets/menwaiter.png";
import menwaiter1 from "./assets/menwaiter1.png";

export const SHIFT_COLORS = {
  morning: "#FFE08A",
  afternoon: "#A5D8FF",
  night: "#B197FC"
};

export const MOCK_EMPLOYEES = [
  { id: 1, name: "Ellen Johansson", phone: "070-111111", position: "Waiter", profilePicture: womanwaiter2 },
  { id: 2, name: "Oskar Nilsson", phone: "070-222222", position: "Waiter", profilePicture: menwaiter },
  { id: 3, name: "John Jones", phone: "070-333333", position: "Waiter", profilePicture: menwaiter1 },
  { id: 4, name: "Maria Ramos", phone: "070-444444", position: "Runner", profilePicture: womanwaiter3 },
  { id: 5, name: "Anna Karlsson", phone: "070-555555", position: "Staff", profilePicture: womanwaiter1 }
];

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const SHIFTS = ["morning", "afternoon", "night"];

// Maps shift names to their database IDs (must match the seed data)
export const SHIFT_IDS = { morning: 1, afternoon: 2, night: 3 };
