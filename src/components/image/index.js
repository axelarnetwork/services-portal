import Image_ from "next/image";

const Image = ({ alt = "", ...rest }) => {
  return <Image_ alt={alt} {...rest} />;
};

export default Image;
