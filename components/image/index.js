import Image from "next/image";

export default ({ alt = "", ...rest }) => {
  return <Image alt={alt} {...rest} />;
};
