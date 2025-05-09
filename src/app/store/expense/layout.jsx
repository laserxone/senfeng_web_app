import PageContainer from "@/components/page-container";

export default function Layout({children}) {
  return (
    <PageContainer scrollable={false}>
     {children}
    </PageContainer>
  );
}
