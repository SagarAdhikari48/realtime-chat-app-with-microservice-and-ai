import Loading from "@/components/Loading";
import VerifyOtp from "@/components/VerifyOtp";
import { Suspense } from "react";

const VerifyPage = () => {
  return (
    //this will not throw error during development phase but
    // when we tried to buld in th production it will throw error so we need suspense to handle this issue
    //suspense is given with loading component to handle the loading state of the component which is being lazy loaded
    <Suspense fallback={<Loading />}>
      <VerifyOtp />
    </Suspense>
  );
};

export default VerifyPage;
