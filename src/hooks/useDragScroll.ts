import { useEffect, useRef } from "react";

/**
 * Permite arrastar com o mouse (click-and-drag) um container rolavel.
 * - Funciona na horizontal ou vertical; touch continua com a rolagem nativa.
 * - Suprime o clique em links/botoes quando o gesto foi um arraste.
 * - Desativa scroll-snap durante o arraste para o movimento ficar fluido.
 */
export function useDragScroll<T extends HTMLElement>(axis: "x" | "y" = "x") {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let moved = false;
    let startPos = 0;
    let startScroll = 0;
    const THRESHOLD = 5;

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      isDown = true;
      moved = false;
      startPos = axis === "x" ? e.pageX : e.pageY;
      startScroll = axis === "x" ? el.scrollLeft : el.scrollTop;
    };

    const onMove = (e: MouseEvent) => {
      if (!isDown) return;
      const delta = (axis === "x" ? e.pageX : e.pageY) - startPos;
      if (!moved && Math.abs(delta) > THRESHOLD) {
        moved = true;
        el.style.scrollSnapType = "none";
        el.style.scrollBehavior = "auto";
        el.style.cursor = "grabbing";
        el.style.userSelect = "none";
      }
      if (moved) {
        e.preventDefault();
        if (axis === "x") el.scrollLeft = startScroll - delta;
        else el.scrollTop = startScroll - delta;
      }
    };

    const end = () => {
      if (!isDown) return;
      isDown = false;
      if (moved) {
        el.style.scrollSnapType = "";
        el.style.scrollBehavior = "";
        el.style.cursor = "";
        el.style.userSelect = "";
      }
    };

    // Captura: cancela o clique que encerra um arraste
    const onClickCapture = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };

    // Evita arrastar imagens/links nativamente
    const onDragStart = (e: DragEvent) => e.preventDefault();

    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", end);
    el.addEventListener("click", onClickCapture, true);
    el.addEventListener("dragstart", onDragStart);
    return () => {
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", end);
      el.removeEventListener("click", onClickCapture, true);
      el.removeEventListener("dragstart", onDragStart);
    };
  }, [axis]);

  return ref;
}
