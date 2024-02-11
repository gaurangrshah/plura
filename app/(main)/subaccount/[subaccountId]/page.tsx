type SubaccountPageIdProps = {
  params: { subaccountId: string }
}

export default function SubaccountPageId(props: SubaccountPageIdProps) {
  return (
    <div>SubaccountId: {props.params.subaccountId}</div>
  )
}
