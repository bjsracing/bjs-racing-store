// src/components/YouTubeEmbed.jsx
import React, { useState, useCallback } from "react";
import { FiPlay } from "react-icons/fi";

/**
 * Reusable YouTube player with click-to-play thumbnail.
 *
 * @param {string} videoId - YouTube video ID
 * @param {string} title - Video title
 * @param {string} [product] - Product name
 * @param {boolean} [showInfo=true] - Show title/product below video
 */
const YouTubeEmbed = ({ videoId, title, product, showInfo = true }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  return (
    <div className="w-full">
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900 group">
        {isPlaying ? (
          <iframe
            src={embedUrl}
            title={title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            onClick={handlePlay}
            className="absolute inset-0 w-full h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-inset"
            aria-label={`Putar video: ${title}`}
          >
            <img
              src={thumbnailUrl}
              alt={title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
              onError={(e) => {
                if (e.target.src.includes("maxresdefault")) {
                  e.target.src = `https://img.youtube.com/vi/${videoId}/sddefault.jpg`;
                } else if (e.target.src.includes("sddefault")) {
                  e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                }
              }}
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-200" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 mobile:w-16 mobile:h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <FiPlay className="w-6 h-6 mobile:w-7 mobile:h-7 text-orange-600 ml-0.5" />
              </div>
            </div>
          </button>
        )}
      </div>

      {showInfo && !isPlaying && (
        <div className="mt-3 px-1">
          <h3 className="text-sm mobile:text-base font-semibold text-slate-800 line-clamp-2">
            {title}
          </h3>
          {product && (
            <p className="text-xs mobile:text-sm text-orange-600 font-medium mt-0.5">
              {product}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default YouTubeEmbed;
