import TurnoverListPage from "../../components/turnover/TurnoverListPage";

export default function PayrollTurnoverList() {
  return (
    <TurnoverListPage
      heading="Payroll - Turnover"
      moduleLabel="Payroll"
      variant="swap"
      editable={false}
    />
  );
}
