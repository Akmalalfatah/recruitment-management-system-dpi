import TurnoverListPage from "../../components/turnover/TurnoverListPage";

// OPS no longer creates or edits turnover manually -- a turnover is
// created automatically the instant Recruitment accepts the linked ERS.
// This page is read-only so OPS can still track progress.
export default function OpsTurnoverList() {
  return (
    <TurnoverListPage
      heading="Operasional - Permintaan Turnover"
      moduleLabel="Operasional"
      variant="area"
      editable={false}
      showCandidates
    />
  );
}
