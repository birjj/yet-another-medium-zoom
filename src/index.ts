import yamz from "./core";
import withCaption from "./caption/caption";
import withAlbum from "./album/album";
import withSwipe from "./swipe/swipe";

export default withSwipe(withAlbum(withCaption(yamz)));
