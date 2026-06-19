'use client';

import { useRouter } from 'next/navigation';
import AllocationModal from './AllocationModal';

interface AllocationModalWrapperProps {
  paymentId: string;
  memberId: string;
  memberName: string;
  amount: number;
}

export default function AllocationModalWrapper({
  paymentId,
  memberId,
  memberName,
  amount,
}: AllocationModalWrapperProps) {
  const router = useRouter();

  function handleClose() {
    router.push('/payments');
  }

  function handleAllocated() {
    router.refresh();
    router.push('/payments');
  }

  return (
    <AllocationModal
      paymentId={paymentId}
      memberId={memberId}
      memberName={memberName}
      amount={amount}
      onClose={handleClose}
      onAllocated={handleAllocated}
    />
  );
}
