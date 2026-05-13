// Single shared profile state via ProfileContext.
// ProfileProvider (in App.tsx) sits above LanguageProvider so all consumers
// of useProfile() see the same profile and react instantly when refetch() is called
// (e.g. after saving location in ProfilePage → weather + native plants update immediately).
export { useProfileContext as useProfile } from "@/contexts/ProfileContext";
