import * as React from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Sun, Moon } from "lucide-react";

import { Input } from "../components/ui/input";
import { Slider } from "../components/ui/slider";
import { checkLinks } from "../api/apiClient";
import { CheckRequest, LinkStatus } from "../api/model/types";
import { LinksTable } from "../components/LinksTable";

// Define the form schema
const formSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  depth: z.number().min(0).max(4).default(1),
});

type FormValues = z.infer<typeof formSchema>;

// Create the server function for checking links
const checkLinksServerFn = createServerFn({ method: "POST" })
  .validator((d: CheckRequest) => formSchema.parse(d))
  .handler(async ({ data }) => {
    return await checkLinks(data);
  });

export const Route = createFileRoute("/")({
  component: Home,
  loader: async () => {
    return { initialResults: [] as LinkStatus[] };
  },
});

function Home() {
  const router = useRouter();
  const { initialResults } = Route.useLoaderData();
  const [results, setResults] = React.useState<LinkStatus[]>(initialResults);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  const [formValues, setFormValues] = React.useState<FormValues>({
    url: "",
    depth: 1,
  });
  const [formErrors, setFormErrors] = React.useState<{
    url?: string;
    depth?: string;
  }>({});

  // Initialize dark mode from localStorage
  React.useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === "true");
    } else if (prefersDark) {
      setIsDarkMode(true);
    }
  }, []);

  // Apply dark mode class to document
  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Save preference to localStorage
    localStorage.setItem("darkMode", isDarkMode.toString());
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate form
    try {
      const validatedData = formSchema.parse(formValues);
      setFormErrors({});

      setIsLoading(true);
      try {
        const data = await checkLinksServerFn({ data: validatedData });
        setResults(data);
      } catch (error) {
        console.error("Error checking links:", error);
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setFormErrors(errors);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDepthChange = (value: number) => {
    setFormValues((prev) => ({
      ...prev,
      depth: value,
    }));
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 transition-colors bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-950">
      {/* Dark mode toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all"
          aria-label={
            isDarkMode ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          {isDarkMode ? (
            <Sun size={20} className="text-yellow-500" />
          ) : (
            <Moon size={20} className="text-indigo-600" />
          )}
        </button>
      </div>

      <div className="w-full max-w-md mx-auto mb-6">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-6 transition-colors">
          <h1 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 text-transparent bg-clip-text">
            Broken Links Checker
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-2">
              <label
                htmlFor="url"
                className="text-sm font-medium leading-none text-gray-600 dark:text-gray-300"
              >
                Website URL
              </label>
              <Input
                id="url"
                name="url"
                type="url"
                placeholder="https://example.com"
                value={formValues.url}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`h-9 px-3 rounded-lg border-gray-200 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white transition-colors ${
                  formErrors.url ? "border-red-500 focus:ring-red-500" : ""
                }`}
              />
              {formErrors.url && (
                <p className="text-red-500 text-xs">{formErrors.url}</p>
              )}
            </div>

            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="depth"
                  className="text-sm font-medium leading-none text-gray-600 dark:text-gray-300"
                >
                  Search Depth
                </label>
                <span className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300 font-medium transition-colors">
                  {formValues.depth}
                </span>
              </div>
              <div className="px-1 py-3">
                <Slider
                  id="depth"
                  value={[formValues.depth]}
                  min={0}
                  max={4}
                  step={1}
                  onValueChange={(values) => handleDepthChange(values[0])}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
                <span>Shallow (0)</span>
                <span>Deep (4)</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 px-4 py-2 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center disabled:opacity-70 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Checking Links...
                </>
              ) : (
                "Check Links"
              )}
            </button>
          </form>
        </div>
      </div>

      {(results.length > 0 || isLoading) && (
        <div className="w-full max-w-6xl mx-auto">
          <LinksTable data={results} isLoading={isLoading} />
        </div>
      )}
    </div>
  );
}
