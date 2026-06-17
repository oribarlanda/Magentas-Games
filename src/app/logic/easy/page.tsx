import logicData from "../../../../data/logic-easy.json";
import LogicGame from "@/components/games/LogicGame";
import GamePageWrapper from "@/components/ui/GamePageWrapper";

export default function LogicEasyPage() {
  return (
    <GamePageWrapper
      title="הגיונית - קל"
      icon="🟢"
      subtitle="הקלידו אות בכל משבצת. שני רמזים חושפים אותיות בירוק."
    >
      <LogicGame data={logicData} />
    </GamePageWrapper>
  );
}
