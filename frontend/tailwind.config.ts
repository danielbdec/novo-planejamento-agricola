import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                border: "var(--border)",
                input: "var(--input)",
                ring: "var(--ring)",
                card: {
                    DEFAULT: "var(--card)",
                    foreground: "var(--card-foreground)",
                },
                primary: {
                    DEFAULT: "var(--primary)",
                    foreground: "var(--primary-foreground)",
                },
                secondary: {
                    DEFAULT: "var(--secondary)",
                    foreground: "var(--secondary-foreground)",
                },
                destructive: {
                    DEFAULT: "var(--destructive)",
                    foreground: "var(--destructive-foreground)",
                },
                muted: {
                    DEFAULT: "var(--muted)",
                    foreground: "var(--muted-foreground)",
                },
                accent: {
                    DEFAULT: "var(--accent)",
                    foreground: "var(--accent-foreground)",
                },
                popover: {
                    DEFAULT: "var(--popover)",
                    foreground: "var(--popover-foreground)",
                },
                // Hard Shell Specific Palette
                agri: {
                    green: {
                        50: "#f0fdf4",
                        100: "#dcfce7",
                        500: "#22c55e",
                        600: "#16a34a",
                        700: "#15803d",
                        800: "#166534",
                        900: "#14532d",
                        950: "#052e16", // Deep Forest
                    },
                    gold: {
                        500: "#eab308",
                        600: "#ca8a04", // Premium Accent
                    },
                    slate: {
                        800: "#1e293b", // Panel Background
                        900: "#0f172a", // App Background
                        950: "#020617", // Darkest
                    }
                }
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                'hard-shell': '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
            },
            backdropBlur: {
                'xs': '2px',
            }
        },
    },
    plugins: [],
};
export default config;
