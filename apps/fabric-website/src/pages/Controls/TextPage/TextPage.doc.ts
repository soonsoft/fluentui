import { TFabricPlatformPageProps } from '../../../interfaces/Platforms';
import { TextPageProps as ExternalProps } from 'office-ui-fabric-react/lib/components/Text/Text.doc';

const related = require('!raw-loader!@uifabric/fabric-website/src/pages/Controls/TextPage/docs/TextRelated.md') as string;
const componentUrl =
  'https://github.com/microsoft/fluentui/tree/master/apps/fabric-website/src/pages/Controls/TextPage';

export const TextPageProps: TFabricPlatformPageProps = {
  web: {
    ...(ExternalProps as any),
    related,
  },
  ios: {
    overview: require('!raw-loader!@uifabric/fabric-website/src/pages/Controls/TextPage/docs/ios/TextOverview.md') as string,
    related,
    componentUrl,
  },
  android: {
    overview: require('!raw-loader!@uifabric/fabric-website/src/pages/Controls/TextPage/docs/android/TextOverview.md') as string,
    related,
    componentUrl,
  },
  mac: {
    overview: require('!raw-loader!@uifabric/fabric-website/src/pages/Controls/TextPage/docs/mac/TextOverview.md') as string,
    usage: require('!raw-loader!@uifabric/fabric-website/src/pages/Controls/TextPage/docs/mac/TextUsage.md') as string,
    related,
    componentUrl,
  },
  windows: {
    overview: require('!raw-loader!@uifabric/fabric-website/src/pages/Controls/TextPage/docs/windows/TextOverview.md') as string,
    usage: require('!raw-loader!@uifabric/fabric-website/src/pages/Controls/TextPage/docs/windows/TextUsage.md') as string,
    related,
    componentUrl,
  },
};