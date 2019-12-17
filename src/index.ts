import yamz from "./core";
import withCaption from "./caption/caption";
import withAlbum from "./album/album";

export default withAlbum(withCaption(yamz));
