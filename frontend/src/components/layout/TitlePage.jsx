export default function TitlePage({ title, subtitle }) {
    return (
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                <p className="text-muted-foreground">{subtitle}</p>
            </div>
      </div>
    );
}
