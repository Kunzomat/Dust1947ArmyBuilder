import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";

jest.mock("./apiClient", () => ({
  apiCall: jest.fn(async (action) => {
    switch (action) {
      case "armies.list":
        return { armies: [] };
      case "factions.list":
        return { factions: [] };
      case "blocs.list":
        return { blocs: [] };
      default:
        return {};
    }
  }),
}));

test("renders the army builder shell", async () => {
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));

  render(<App />);

  expect(screen.getByText(/Dust 1947 – Army Builder/i)).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText(/Neue Armee/i)).toBeInTheDocument();
  });
});
