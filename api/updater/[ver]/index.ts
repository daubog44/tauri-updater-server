async function downloadFile(url: string) {
    const res = await fetch(url);
    const data = await res.blob();
    const text = await data.text();
    return text;
}
async function getReleases(owner: string, repo: string) {
    const url = `https://api.github.com/repos/${owner}/${repo}/releases`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

async function getLatestRelease(owner: string, repo: string): Promise<Release> {
    const releases = await getReleases(owner, repo);
    return releases[0];
}

async function downloadAllSig(releaseDataAssets: Release["assets"]) {
    const obj = {
        "windows-x86_64": { endpoint: "it-IT.msi.zip.sig" },
        "linux-x86_64": { endpoint: ".AppImage.tar.gz.sig" },
        "darwin-x86_64": { endpoint: ".app.tar.gz.sig" },
    };

    let urlObj: any;
    for (const el of Object.entries(obj)) {
        const key = el[0];
        const url = releaseDataAssets.find((ass) =>
            ass.browser_download_url.endsWith(el[1].endpoint)
        )?.browser_download_url as string;
        const signature = await downloadFile(url);
        urlObj = { ...urlObj, [key]: { url: url.replace(".sig", ""), signature } };
    }
    return urlObj;
}

export default defineEventHandler(async (e) => {
    const searchParams = new URLSearchParams(e.path.split("?")[1]);
    const [owner, repo] = [searchParams.get("owner"), searchParams.get("repo")];
    if (!owner || !repo) throw createError({
        statusCode: 404,
        statusMessage: "the request require repo and owner searchparams!"
    });

    try {
        const releaseData = await getLatestRelease(owner, repo);
        const platforms = await downloadAllSig(releaseData.assets);

        return {
            version: releaseData.tag_name,
            notes: "Release version",
            pub_date: releaseData.published_at,
            platforms,
        };
    } catch (error) {
        let err = error as Error;
        e.captureError(err, e.context);
        throw createError({
            statusCode: 500,
            statusMessage: err.message,
        });;
    }
})

interface Asset {
    url: string;
    id: string;
    node_id: string;
    name: string;
    label: string;
    uploader: any;
    content_type: string;
    state: string;
    size: string;
    download_count: string;
    created_at: string;
    updated_at: string;
    browser_download_url: string;
}

type Release = {
    url: string;
    assets_url: string;
    upload_url: string;
    html_url: string;
    id: number;
    author: {
        login: string;
        id: number;
        node_id: string;
        avatar_url: string;
        gravatar_id: string;
        url: string;
        html_url: string;
        followers_url: string;
        following_url: string;
        gists_url: string;
        starred_url: string;
        subscriptions_url: string;
        organizations_url: string;
        repos_url: string;
        events_url: string;
        received_events_url: string;
        type: string;
        site_admin: boolean;
    };
    node_id: string;
    tag_name: string;
    target_commitish: string;
    name: string;
    draft: string;
    prerelease: string;
    created_at: string;
    published_at: string;
    assets: Asset[];
    tarball_url: string;
    zipball_url: string;
    body: string;
};
