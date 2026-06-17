import logicData from "../../../../data/logic-hard.json";
import LogicGame from "@/components/games/LogicGame";
import GamePageWrapper from "@/components/ui/GamePageWrapper";

export default function LogicHardPage() {
  return (
    <GamePageWrapper
      title="הגיונית - קשה"
      icon="🔴"
      subtitle="הקלידו אות בכל משבצת. שני רמזים חושפים אותיות בירוק."
    >
      <LogicGame data={logicData} />
    </GamePageWrapper>
  );
}
