import logicData from "../../../data/logic.json";
import LogicGame from "@/components/games/LogicGame";
import GamePageWrapper from "@/components/ui/GamePageWrapper";

export default function LogicPage() {
  return (
    <GamePageWrapper title="הגיונית" icon="🧠" subtitle="קראו בעיון, חישבו מחוץ לקופסה.">
      <LogicGame data={logicData} />
    </GamePageWrapper>
  );
}
