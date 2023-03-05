import { useCallback, useEffect, useState } from 'react';
import { Alert, PlatformColor, Switch, TextStyle, Text, ViewStyle } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { observer } from 'mobx-react-lite';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppStackParamList } from '@/navigators';
import { t } from '@/locales';
import { BottomActionBar } from './components/BottomActionBar';
import { ListCell, ListSection, SettingsIcon } from '@/components';
import {
  clearBlockedApplications,
  FamilyActivityPicker,
  requestAuthorization,
  isApproved,
} from '@/lib/ScreenTime';
import { useStores } from '@/models';
import { color } from '@/theme';
import { human } from 'react-native-typography';

export const HomeScreen = observer((props: NativeStackScreenProps<AppStackParamList, 'Home'>) => {
  const { settingsStore } = useStores();
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (!settingsStore.hideAppEnabled) {
      clearBlockedApplications();
    }

    isApproved().then(async (v) => {
      setApproved(v);
      if (!v) {
        alertPermission();
      }
    });
  }, []);

  async function alertPermission() {
    settingsStore.setHideAppEnabled(false);

    try {
      await requestAuthorization();
      setApproved(true);
    } catch {
      setApproved(false);
      Alert.alert(
        t('homeScreen.applicationPicker.permission.title'),
        t('homeScreen.applicationPicker.permission.message'),
        [
          {
            text: t('common.ok'),
            style: 'default',
          },
        ],
      );
    }
  }

  const handleValueChange = useCallback(
    (value: boolean) => {
      if (approved) {
        settingsStore.setHideAppEnabled(value);
      } else {
        alertPermission();
      }
    },
    [approved, alertPermission],
  );

  const handleFamilyActivityPickerPress = useCallback(() => {
    alertPermission();
  }, [alertPermission]);

  return (
    <SafeAreaView style={[$container]} edges={['bottom', 'left', 'right']}>
      <ListSection>
        <ListCell
          text={t('homeScreen.hideAppEnabled')}
          leftIcon={
            <SettingsIcon
              systemName="eye.slash.fill"
              backgroundColor={PlatformColor('systemPurple')}
            />
          }
          RightAccessory={
            <Switch value={settingsStore.hideAppEnabled} onValueChange={handleValueChange} />
          }
          bottomSeparator={false}
          rightIcon={null}
        />
        <ListCell
          text={t('homeScreen.count')}
          RightAccessory={<Text style={$count}>{settingsStore.selectedAppCount}</Text>}
          rightIcon={null}
          leftIcon={<SettingsIcon systemName="apps.iphone" backgroundColor={color.primary} />}
          noTouchableHighlight
          bottomSeparator={false}
        />
      </ListSection>
      <ListSection headerText={t('homeScreen.applicationPicker.title')}>
        {approved ? (
          <FamilyActivityPicker
            style={[$familyActivityPicker]}
            onActivityChange={settingsStore.setSelectedAppCount}
          />
        ) : (
          <ListCell
            text={t('homeScreen.applicationPicker.permission.button')}
            textStyle={{
              color: PlatformColor('systemBlue'),
            }}
            rightIcon={null}
            bottomSeparator={false}
            onPress={handleFamilyActivityPickerPress}
          />
        )}
      </ListSection>

      <BottomActionBar
        onPressSettings={() => {
          props.navigation.navigate('Settings');
        }}
      />
    </SafeAreaView>
  );
});

const $container: ViewStyle = {
  flex: 1,
  paddingTop: 20,
  paddingHorizontal: 20,
};

const $familyActivityPicker: TextStyle = {
  height: 500,
  flex: 1,
};

const $count: TextStyle = {
  ...human.bodyObject,
  color: color.primary,
  fontWeight: '500',
};