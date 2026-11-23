"use client";
import Interactive3DStage from "./Interactive3DStage";
import SevenLessonScene,{type SceneProps} from "./SevenLessonScene";
export default function SevenLessonStage(props:SceneProps){return <Interactive3DStage label={`Interactive 3D ${props.kind} model`}><SevenLessonScene {...props}/></Interactive3DStage>}
