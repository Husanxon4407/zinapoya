import { VIDEO_URL } from '../../data/site.js';
import { useT } from '../../i18n/index.js';

// Turns a YouTube/Vimeo link into an embed URL; plain .mp4 plays directly.
function embed(url) {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  if (yt) return { type: 'iframe', src: `https://www.youtube.com/embed/${yt[1]}` };
  const vi = url.match(/vimeo\.com\/(\d+)/);
  if (vi) return { type: 'iframe', src: `https://player.vimeo.com/video/${vi[1]}` };
  if (/\.mp4($|\?)/i.test(url)) return { type: 'video', src: url };
  return { type: 'iframe', src: url };
}

export default function VideoBox() {
  const t = useT();
  return (
    <section className="video-sec" id="video">
      <h2 className="section-title">{t('A quick tour')}</h2>
      <div className="video-frame">
        {VIDEO_URL ? (
          embed(VIDEO_URL).type === 'video' ? (
            <video controls src={embed(VIDEO_URL).src} />
          ) : (
            <iframe src={embed(VIDEO_URL).src} title={t('A quick tour')} allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen />
          )
        ) : (
          <div className="video-placeholder">
            <span className="video-placeholder__play">▶</span>
            <p>{t('Guide video coming soon')}</p>
          </div>
        )}
      </div>
    </section>
  );
}
