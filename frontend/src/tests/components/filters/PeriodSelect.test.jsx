import { render, screen, fireEvent } from "@testing-library/react";
import * as PeriodSelectModule from "../../../components/filters/PeriodSelect";
import { firstDayOfMonthISO, lastDayOfMonthISO } from "../../../utils/date";

const PeriodSelect = PeriodSelectModule.default || PeriodSelectModule.PeriodSelect;

jest.mock("../../../components/ui/Select", () => {
    const React = require("react");
    const SelectContext = React.createContext(() => {});

    const Select = ({ onValueChange, children }) => (
        <SelectContext.Provider value={onValueChange}>
            <div>{children}</div>
        </SelectContext.Provider>
    );

    const SelectTrigger = ({ children, className }) => (
        <div className={className}>{children}</div>
    );

    const SelectValue = ({ placeholder, children }) => (
        <span>{children || placeholder}</span>
    );

    const SelectContent = ({ children }) => <div>{children}</div>;

    const SelectItem = ({ value, children }) => {
        const onValueChange = React.useContext(SelectContext);

        return (
            <button type="button" onClick={() => onValueChange(value)}>
                {children}
            </button>
        );
    };

    return { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
});

jest.mock("../../../components/ui/Input", () => ({
    InputDate: ({ value, onChange, ...rest }) => (
        <input
            data-testid="input-date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            {...rest}
        />
    ),
}));

jest.mock("../../../components/ui/Button", () => ({
    Button: ({ children, ...rest }) => <button {...rest}>{children}</button>,
}));

describe("PeriodSelect", () => {
    it("shows 'Este mês' when date range matches current month", () => {
        const now = new Date();
        const start = firstDayOfMonthISO(now);
        const end = lastDayOfMonthISO(now);

        render(
            <PeriodSelect
                dateStart={start}
                dateEnd={end}
                onChange={jest.fn()}
            />
        );

        const matches = screen.getAllByText("Este mês");
        const label = matches.find((el) => el.tagName.toLowerCase() === "span");

        expect(label).toBeTruthy();
    });

    it("calls onChange with this week range when 'Esta semana' is selected", () => {
        const onChange = jest.fn();

        render(
        <PeriodSelect
            dateStart={null}
            dateEnd={null}
            onChange={onChange}
        />
        );

        const weekButton = screen.getByText("Esta semana");

        fireEvent.click(weekButton);

        expect(onChange).toHaveBeenCalledTimes(1);
        const args = onChange.mock.calls[0];

        expect(args.length).toBe(2);
        expect(typeof args[0]).toBe("string");
        expect(typeof args[1]).toBe("string");
    });

    it("opens custom panel when 'Personalizado' is selected", () => {
        render(
            <PeriodSelect
                dateStart="2024-01-01"
                dateEnd="2024-01-31"
                onChange={jest.fn()}
            />
        );

        const customButton = screen.getByText("Personalizado");

        fireEvent.click(customButton);

        const panelTitle = screen.getByText("Escolha o período");

        expect(panelTitle).toBeTruthy();
    });

    it("updates dates via custom inputs and calls onChange for start and end", () => {
        const onChange = jest.fn();

        render(
            <PeriodSelect
                dateStart="2024-01-01"
                dateEnd="2024-01-31"
                onChange={onChange}
            />
        );

        const customButton = screen.getByText("Personalizado");
        fireEvent.click(customButton);

        const inputs = screen.getAllByTestId("input-date");
        const startInput = inputs[0];
        const endInput = inputs[1];

        fireEvent.change(startInput, { target: { value: "2024-01-05" } });
        expect(onChange).toHaveBeenCalledWith("2024-01-05", "2024-01-31");

        fireEvent.change(endInput, { target: { value: "2024-01-20" } });
        expect(onChange).toHaveBeenLastCalledWith("2024-01-01", "2024-01-20");
    });

    it("closes custom panel when clicking 'Fechar'", () => {
        render(
            <PeriodSelect
                dateStart="2024-01-01"
                dateEnd="2024-01-31"
                onChange={jest.fn()}
            />
        );

        const customButton = screen.getByText("Personalizado");

        fireEvent.click(customButton);

        const closeButton = screen.getByText("Fechar");

        fireEvent.click(closeButton);

        const panelTitle = screen.queryByText("Escolha o período");

        expect(panelTitle).toBeNull();
    });
});
