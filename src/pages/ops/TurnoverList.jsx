import { useNavigate } from "react-router-dom";
import TurnoverListPage from "../../components/turnover/TurnoverListPage";

export default function OpsTurnoverList() {
  const navigate = useNavigate();
  return (
    <TurnoverListPage
      heading="Operasional - Permintaan Turnover"
      moduleLabel="Operasional"
      variant="area"
      editable
      addButton={{ label: "+ Tambah Turnover Baru", onClick: () => navigate("/ops/turnover/new") }}
    />
  );
}
