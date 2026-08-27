import { writable } from "svelte/store";

function createCompanySettingsStore() {
    const stored = typeof localStorage !== "undefined"
        ? localStorage.getItem("companySettings")
        : null;

    const { subscribe, set, update } = writable(
        stored
            ? JSON.parse(stored)
            : {
                  company_name: "iZone Hub",
                  company_logo: "",
                  company_website: "",
                  company_location: "Addis Ababa, Ethiopia",
              }
    );

    return {
        subscribe,
        update: (fn) => {
            update((val) => {
                const next = fn(val);
                if (typeof localStorage !== "undefined") {
                    localStorage.setItem("companySettings", JSON.stringify(next));
                }
                return next;
            });
        },
        set: (val) => {
            set(val);
            if (typeof localStorage !== "undefined") {
                localStorage.setItem("companySettings", JSON.stringify(val));
            }
        },
    };
}

export const companySettings = createCompanySettingsStore();
