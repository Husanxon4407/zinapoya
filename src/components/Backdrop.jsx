// Fixed, decorative background: a few very soft, slowly drifting cyan lights
// behind the page. Kept faint on purpose so the content stays the focus.
export default function Backdrop() {
  return (
    <div className="backdrop" aria-hidden>
      <span className="prism prism--1" />
      <span className="prism prism--2" />
      <span className="prism prism--3" />
      <span className="prism prism--4" />
      <div className="backdrop__grid" />
    </div>
  );
}
