import { useEffect, useState } from "react";
import { Droppable } from "react-beautiful-dnd";

function StrictModeDroppable(props) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => setEnabled(true));

    return () => {
      window.cancelAnimationFrame(animationFrame);
      setEnabled(false);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return <Droppable {...props}>{props.children}</Droppable>;
}

export default StrictModeDroppable;
